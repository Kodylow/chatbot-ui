import { Message } from '@/types/chat';
import { OpenAIModel } from '@/types/openai';

import { AZURE_DEPLOYMENT_ID, OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION } from '../app/const';

import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';

import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  basePath: 'https://localhost:4891/v1'
});

const openai = new OpenAIApi(configuration);

export class OpenAIError extends Error {
  type: string;
  param: string;
  code: string;

  constructor(message: string, type: string, param: string, code: string) {
    super(message);
    this.name = 'OpenAIError';
    this.type = type;
    this.param = param;
    this.code = code;
  }
}

function parseInvoice(auth_header: string) {
    const rex = /LSAT macaroon="(.*?)", invoice="(.*?)"/i;
    let parts = auth_header.match(rex);
    if (!parts) {
        throw new Error("No match found");
    }
    let macaroon = parts[1];
    let invoice = parts[2];

    return { macaroon, invoice };
}

export const OpenAIStream = async (
  model: OpenAIModel,
  systemPrompt: string,
  temperature : number,
  messages: Message[],
) => {
  let url = `http://localhost:8085/v1/chat/completions`;

  console.log("Starting call to GPT4ALL with model...")
  console.log(model)
  let res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify({
      ...(OPENAI_API_TYPE === 'openai' && {model: model.id}),
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
      max_tokens: 1000,
      temperature: temperature,
      stream: true,
    }),
  });
  console.log("Received response from GPT4ALL...")

    console.log(res);

  if (res.status === 402) {
        let l402_req = res.headers.get('www-authenticate');

        console.log(l402_req);
        if (!l402_req) {
            throw new Error("No www-authenticate header found");
        }
        let invoice_payload = parseInvoice(l402_req);
        console.log(invoice_payload);

        await window.webln.enable();
        const { preimage } = await window.webln.sendPayment(
          invoice_payload.invoice,
        );
        const paymentSuccessful = !!preimage;
        
        const authorization = "LSAT " + invoice_payload.macaroon + ":" + preimage;
        let new_headers = {
          'Content-Type': 'application/json',
          'Authorization': authorization,
        }

          console.log("DID L402 Starting call to GPT4ALL...")
          res = await fetch(url, {
            headers: new_headers,
            method: 'POST',
            body: JSON.stringify({
              ...(OPENAI_API_TYPE === 'openai' && {model: model.id}),
              messages: [
                {
                  role: 'system',
                  content: systemPrompt,
                },
                ...messages,
              ],
              max_tokens: 1000,
              temperature: temperature,
              stream: true,
            }),
          });
          console.log("Received L402 response from GPT4ALL...")
  }

  console.log("trying to get json")
  const result = await res.json();
  console.log("Received JSON from GPT4ALL...")
  console.log(result)

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  console.log("Checking status...")
  console.log("Status: ", res.status)
  if (res.status !== 200) {
    if (result.error) {
      throw new OpenAIError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
      );
    } else {
      throw new Error(
        `OpenAI API returned an error: ${
          decoder.decode(result?.value) || result.statusText
        }`,
      );
    }
  }

  return result.choices[0].text;
};
