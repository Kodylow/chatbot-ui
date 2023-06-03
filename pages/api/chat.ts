import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { OpenAIError, OpenAIStream } from '@/utils/server';
import { ChatBody, Message } from '@/types/chat';
// @ts-expect-error
import wasm from '../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module';

import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json';
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init';
import { OpenAIModel } from '@/types/openai';
import * as bolt11 from 'bolt11';

const key = process.env.OPENAI_API_KEY;
const signing_key = process.env.SIGNING_KEY;
const lightning_callback = process.env.LIGHTNING_CALLBACK;
const lightning_verify = process.env.LIGHTNING_VERIFY;

export const config = {
  runtime: 'edge',
};

// This is the helper function to decode the invoice and preimage from the www-authenticate header
const decodeAuthHeader = (authHeader: string) => {
  const parts = authHeader.split(' ');
  if (parts.length !== 3) {
    throw new Error('Invalid authHeader format');
  }

  const macaroonParts = parts[1].split('=');
  const invoiceParts = parts[2].split('=');
  if (macaroonParts.length !== 2 || invoiceParts.length !== 2 || macaroonParts[0] !== 'macaroon' || invoiceParts[0] !== 'invoice') {
    throw new Error('Invalid authHeader format');
  }

  const splitMacaroon = macaroonParts[1].split(':');
  if (splitMacaroon.length !== 2) {
    throw new Error('Invalid macaroon:preimage format');
  }
  
  return { verifyHash: splitMacaroon[0], preimage: splitMacaroon[1], invoice: invoiceParts[1] };
};

// This is your checkInvoicePaid function
const checkInvoicePaid = async (authHeader: string) => {
  const { verifyHash, preimage, invoice } = decodeAuthHeader(authHeader);
  const response = await fetch(`${lightning_verify}/${verifyHash}`);
  const data = await response.json();
  if (data.settled !== true || data.preimage !== preimage) {
    console.log('Invoice not paid, reissuing');
    return false;
  }
  return true;
};

const getL402 = async (amount: number) => {
  amount = Math.max(amount, 1000);
  const response = await fetch(`${lightning_callback}?amount=${amount}`);
  const json_response = await response.json();
  // TODO: save the verify hash for later
  const verify_hash = json_response.verify.split('/')[-1];
  return `LSAT macaroon="${verify_hash}:" invoice="${json_response.pr}"`;
};

const getAmount = (tokenCount: number, model: OpenAIModel) => {
  const tokensPer1K = tokenCount / 1000;
  const amount = Math.ceil(tokensPer1K * model.msatsPer1K);
  console.log('amount', amount);
  return amount;
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const { model, messages, prompt, temperature } = (await req.json()) as ChatBody;

    await init((imports) => WebAssembly.instantiate(wasm, imports));
    const encoding = new Tiktoken(
      tiktokenModel.bpe_ranks,
      tiktokenModel.special_tokens,
      tiktokenModel.pat_str,
    );

    let promptToSend = prompt;
    if (!promptToSend) {
      promptToSend = DEFAULT_SYSTEM_PROMPT;
    }

    let temperatureToUse = temperature;
    if (temperatureToUse == null) {
      temperatureToUse = DEFAULT_TEMPERATURE;
    }

    const prompt_tokens = encoding.encode(promptToSend);

    let tokenCount = prompt_tokens.length;
    console.log('tokenCount', tokenCount);
    let messagesToSend: Message[] = [];

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const tokens = encoding.encode(message.content);

      if (tokenCount + tokens.length + 1000 > model.tokenLimit) {
        break;
      }
      console.log(`adding ${tokens.length} tokens for message ${i}`)
      tokenCount += tokens.length;
      messagesToSend = [message, ...messagesToSend];
    }

    const { headers } = req;

    encoding.free();

    const auth_header = headers.get('www-authenticate');

    if (!auth_header || !await checkInvoicePaid(auth_header)) {
      console.log('bad www-authenticate header')
      const amount = getAmount(tokenCount, model);
      const l402 = await getL402(amount);
      // return a 402 Payment Required response with the invoice in the www-authenticate header
      return new Response('Payment Required', {
        status: 402,
        statusText: 'Payment Required',
        headers: {
          'Content-Type': 'text/plain',
          'www-authenticate': l402,
        },
      });
    };

    const stream = await OpenAIStream(model, promptToSend, temperatureToUse, (key ? key : ""), messagesToSend);

    return new Response(stream);
  } catch (error) {
    console.error(error);
    if (error instanceof OpenAIError) {
      return new Response('Error', { status: 500, statusText: error.message });
    } else {
      return new Response('Error', { status: 500 });
    }
  }
};

export default handler;
