import {
  IconBolt,
  IconBulbFilled,
  IconCheck,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import {
  DragEvent,
  MouseEventHandler,
  useContext,
  useEffect,
  useState,
} from 'react';

import { Prompt } from '@/types/prompt';

import SidebarActionButton from '@/components/Buttons/SidebarActionButton';

import PromptbarContext from '../PromptBar.context';
import { PromptModal } from './PromptModal';
import { InvoiceModal } from '@/components/Chat/InvoiceModal';

type LightningInvoice = {
  status: string;
  successAction: {
    tag: string;
    message: string;
  };
  verify: string;
  routes: any[];
  pr: string;
};

type LightningAddressResponse = {
  callback: string;
  maxSendable: number;
  minSendable: number;
  metadata: string;
  commentAllowed: number;
  tag: string;
};

interface Props {
  prompt: Prompt;
}

export const PromptComponent = ({ prompt }: Props) => {
  const {
    dispatch: promptDispatch,
    handleUpdatePrompt,
    handleDeletePrompt,
  } = useContext(PromptbarContext);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [lightningInvoice, setLightningInvoice] =
    useState<LightningInvoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [onSuccess, setOnSuccess] = useState<() => void>(() => () => {});
  const [isUnlocked, setIsUnlocked] = useState(prompt.isUnlocked);

  const fetchLightningInvoice = async () => {
    let lightningCallback = '';
    const [username, host] = "ruinedhalibut23@walletofsatoshi.com".split('@');
    const milliSatsPerPrompt = 100000;
    if (!username || !host) {
      alert('Invalid Lightning address');
      return;
    }
    try {
      const response = await fetch(
        `https://${host}/.well-known/lnurlp/${username}`,
      );

      if (response.ok) {
        const json: LightningAddressResponse = await response.json();
        if (json.tag === 'payRequest') {
          lightningCallback = json.callback;
        } else {
          alert('Invalid Lightning address');
        }
      } else {
        alert('Invalid Lightning address');
      }
    } catch (error) {
      alert(`Failed to verify Lightning address:${error}`);
    }

    try {
      console.log('Lighting callback: ', lightningCallback);
      const response = await fetch(
        lightningCallback + '?amount=' + milliSatsPerPrompt,
      );
      console.log('Response: ', response);
      if (response.ok) {
        const invoice: LightningInvoice = await response.json();
        return invoice;
      } else {
        throw new Error('Failed to fetch lightning invoice');
      }
    } catch (error) {
      console.error('Failed to fetch lightning invoice:', error);
      return null;
    }
  };

  const handleInvoice = async () => {

    const invoice = await fetchLightningInvoice();
    if (!invoice) {
      alert('Error fetching invoice');
      return;
    }
    setLightningInvoice(invoice);
    if (!invoice) {
      alert(
        'Failed to fetch lightning invoice. Please set your lightning address.',
      );
      return;
    }
    let paymentSuccessful = false;
    if (typeof window.webln !== 'undefined') {
      try {
        await window.webln.enable();
        const { preimage } = await window.webln.sendPayment(
          invoice && invoice.pr,
        );
        paymentSuccessful = !!preimage;
      } catch {
        // Open the modal and wait for the payment
        setShowInvoiceModal(true);
        paymentSuccessful = await new Promise((resolve) => {
          // Handle payment failure or modal close
          const paymentFailedOrModalClosed = () => {
            resolve(false);
          };
        });
      }
    } else {
      // Open the modal and wait for the payment
      console.log('showing modal');
      setShowInvoiceModal(true);
      paymentSuccessful = await new Promise((resolve) => {
        // Handle payment failure or modal close
        const paymentFailedOrModalClosed = () => {
          resolve(false);
        };
      });
    }

    console.log('paymentSuccessful: ', paymentSuccessful)
    if (paymentSuccessful) {
      prompt.isUnlocked = true;
      setIsUnlocked(true);
    } else {
      alert('Payment failed');
    }

    setShowInvoiceModal(false);
    setLightningInvoice(null);
  }

  const handleUpdate = (prompt: Prompt) => {
    handleUpdatePrompt(prompt);
    promptDispatch({ field: 'searchTerm', value: '' });
  };

  const handleDelete: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();

    if (isDeleting) {
      handleDeletePrompt(prompt);
      promptDispatch({ field: 'searchTerm', value: '' });
    }

    setIsDeleting(false);
  };

  const handleCancelDelete: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    setIsDeleting(false);
  };

  const handleOpenDeleteModal: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    setIsDeleting(true);
  };

  const handleDragStart = (e: DragEvent<HTMLButtonElement>, prompt: Prompt) => {
    if (e.dataTransfer) {
      e.dataTransfer.setData('prompt', JSON.stringify(prompt));
    }
  };

  useEffect(() => {
    if (isRenaming) {
      setIsDeleting(false);
    } else if (isDeleting) {
      setIsRenaming(false);
    }
  }, [isRenaming, isDeleting]);

  return (
    <div className="relative flex items-center">
      <button
        className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:bg-[#343541]/90"
        draggable="true"
        onClick={(e) => {
          e.stopPropagation();
          prompt.isUnlocked ? setShowModal(true) : handleInvoice();
        }}
        onDragStart={(e) => handleDragStart(e, prompt)}
        onMouseLeave={() => {
          setIsDeleting(false);
          setIsRenaming(false);
          setRenameValue('');
        }}
      >
        {prompt.isUnlocked ? <IconBulbFilled size={18}/> : <IconBolt size={18}/>}

        <div className="relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all pr-4 text-left text-[12.5px] leading-3">
          {prompt.name}
        </div>
      </button>

      {(isDeleting || isRenaming) && (
        <div className="absolute right-1 z-10 flex text-gray-300">
          <SidebarActionButton handleClick={handleDelete}>
            <IconCheck size={18} />
          </SidebarActionButton>

          <SidebarActionButton handleClick={handleCancelDelete}>
            <IconX size={18} />
          </SidebarActionButton>
        </div>
      )}

      {!isDeleting && !isRenaming && prompt.isUnlocked && (
        <div className="absolute right-1 z-10 flex text-gray-300">
          <SidebarActionButton handleClick={handleOpenDeleteModal}>
            <IconTrash size={18} />
          </SidebarActionButton>
        </div>
      )}

      {showModal && (
        <PromptModal
          prompt={prompt}
          onClose={() => setShowModal(false)}
          onUpdatePrompt={handleUpdate}
        />
      )}

      {showInvoiceModal && (
        <InvoiceModal
        lightningInvoice={lightningInvoice}
        setShowModal={setShowInvoiceModal}
        onSuccess={onSuccess}
      />
          
      )}
    </div>
  );
};
