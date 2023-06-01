import { OPENAI_API_TYPE } from '../utils/app/const';

export interface OpenAIModel {
  id: string;
  name: string;
  maxLength: number; // maximum length of a message
  tokenLimit: number;
}

export enum OpenAIModelID {
  GPT_4 = 'chatgpt-gpt-4',
  MPT_7B_CHAT = 'mpt-7b-chat',
  GPT4ALL_J_V13_GROOVY = 'gpt4all-j-v1.3-groovy',
  GPT4ALL_L13B_SNOOZY = 'gpt4all-l13b-snoozy',
  GPT4ALL_J_V11_BREEZY = 'gpt4all-j-v1.1-breezy',
  GPT4ALL_J_V12_JAZZY = 'gpt4all-j-v1.2-jazzy',
  GPT4ALL_J = 'gpt4all-j',
  MPT_7B_BASE = 'mpt-7b-base',
  MPT_7B_INSTRUCT = 'mpt-7b-instruct',
  NOUS_GPT4_VICUNA_13B = 'nous-gpt4-vicuna-13b',
  STABLE_VICUNA_13BQ4_2 = 'stable-vicuna-13b.q4_2',
  VICUNA_13B_11_q4_2 = 'vicuna-13b-1.1-q4_2',
  VICUNA_7B_11_q4_2 = 'vicuna-7b-1.1-q4_2',
  WIZARDLM_7B_q4_2 = 'chatgpt-gpt-3.5-turbo',

}

// in case the `DEFAULT_MODEL` environment variable is not set or set to an unsupported model
export const fallbackModelID = OpenAIModelID.WIZARDLM_7B_q4_2;

export const OpenAIModels: Record<OpenAIModelID, OpenAIModel> = {
  [OpenAIModelID.MPT_7B_CHAT]: {
    id: OpenAIModelID.MPT_7B_CHAT,
    name: 'MPT-7B-Chat',
    maxLength: 24000,
    tokenLimit: 8000,
  },
  [OpenAIModelID.GPT4ALL_J_V13_GROOVY]: {
    id: OpenAIModelID.GPT4ALL_J_V13_GROOVY,
    name: 'GPT4All-J-v1.3-Groovy',
    maxLength: 24000,
    tokenLimit: 8000,
  },
  [OpenAIModelID.GPT4ALL_L13B_SNOOZY]: {
    id: OpenAIModelID.GPT4ALL_L13B_SNOOZY,
    name: 'GPT4All-L13B-Snoozy',
    maxLength: 24000,
    tokenLimit: 8000,
  },
  [OpenAIModelID.GPT4ALL_J_V11_BREEZY]: {
    id: OpenAIModelID.GPT4ALL_J_V11_BREEZY,
    name: 'GPT4All-J-v1.1-Breezy',
    maxLength: 24000,
    tokenLimit: 8000,
  },
  [OpenAIModelID.GPT4ALL_J_V12_JAZZY]: {
    id: OpenAIModelID.GPT4ALL_J_V12_JAZZY,
    name: 'GPT4All-J-v1.2-Jazzy',
    maxLength: 24000,
    tokenLimit: 8000,
  },
  [OpenAIModelID.GPT4ALL_J]: {
    id: OpenAIModelID.GPT4ALL_J,
    name: 'GPT4All-J',
    maxLength: 24000,
    tokenLimit: 8000,
  },
  [OpenAIModelID.MPT_7B_BASE]: {
    id: OpenAIModelID.MPT_7B_BASE,
    name: 'MPT-7B-Base',
    maxLength: 24000,
    tokenLimit: 8000,
  },
  [OpenAIModelID.MPT_7B_INSTRUCT]: {
    id: OpenAIModelID.MPT_7B_INSTRUCT,
    name: 'MPT-7B-Instruct',
    maxLength: 24000,
    tokenLimit: 8000,
  },
  [OpenAIModelID.NOUS_GPT4_VICUNA_13B]: {
    id: OpenAIModelID.NOUS_GPT4_VICUNA_13B,
    name: 'Nous-GPT4-Vicuna-13B',
    maxLength: 24000,
    tokenLimit: 8000,
  },
  [OpenAIModelID.STABLE_VICUNA_13BQ4_2]: {
    id: OpenAIModelID.STABLE_VICUNA_13BQ4_2,
    name: 'Stable-Vicuna-13B.q4_2',
    maxLength: 24000,
    tokenLimit: 8000,
  },
  [OpenAIModelID.VICUNA_13B_11_q4_2]: {
    id: OpenAIModelID.VICUNA_13B_11_q4_2,
    name: 'Vicuna-13B-1.1-q4_2',
    maxLength: 24000,
    tokenLimit: 8000,
  },
  [OpenAIModelID.VICUNA_7B_11_q4_2]: {
    id: OpenAIModelID.VICUNA_7B_11_q4_2,
    name: 'Vicuna-7B-1.1-q4_2',
    maxLength: 24000,
    tokenLimit: 8000,
  },
  [OpenAIModelID.WIZARDLM_7B_q4_2]: {
    id: OpenAIModelID.WIZARDLM_7B_q4_2,
    name: 'WizardLM-7B.q4_2',
    maxLength: 24000,
    tokenLimit: 8000,
  },
  [OpenAIModelID.GPT_4]: {
    id: OpenAIModelID.GPT_4,
    name: 'GPT-4',
    maxLength: 24000,
    tokenLimit: 8000,
  },
};
