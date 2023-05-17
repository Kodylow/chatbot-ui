import { FC, KeyboardEvent, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode.react';
import { Prompt } from '@/types/prompt';
import { IconCircleCheck } from '@tabler/icons-react';
import bolt11 from 'bolt11';
import { milliSatsToCents } from '@/utils/app/conversionHelpers';

type LightningInvoice = {
    status: string;
    successAction: {
        tag: string;
        message: string;
    };
    verify: string;
    routes: any[]; // You can replace this with a more specific type if needed
    pr: string;
};

type Props = {
    lightningInvoice: LightningInvoice | null;
    setShowModal: (showModal: boolean) => void;
    onSuccess: () => void;
};    
export const InvoiceModal: FC<Props> = ({
  lightningInvoice,
  setShowModal,
  onSuccess,
}) => {
    const [status, setStatus] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isReady, setIsReady] = useState(false);
    const [modalOpacity, setModalOpacity] = useState(0);
    const [amountCents, setAmountCents] = useState<number | null>(null);
  
    const modalRef = useRef<HTMLDivElement>(null);
  
    const handleCopyClick = () => {
      if (lightningInvoice) {
        navigator.clipboard.writeText(lightningInvoice.pr);
      }
    };
  
    // Modify the useEffect to animate the opacity when the modal is displayed
    useEffect(() => {
      if (isReady) {
        setModalOpacity(1);
      } else {
        setModalOpacity(0);
      }
    }, [isReady]);
  
    const handleOpenClick = () => {
      if (lightningInvoice) {
        window.open(`lightning:${lightningInvoice.pr}`);
      }
    };
  
    useEffect(() => {
      const paymentAmount = async () => {
        if (lightningInvoice) {
          const decodedInvoice = bolt11.decode(lightningInvoice.pr);
          const amountSat = decodedInvoice.satoshis ? decodedInvoice.satoshis : 0;
          let amountCents = await milliSatsToCents(amountSat);
          amountCents = amountCents * 1000;
          return amountCents;
        }
        return null;
      };
      const fetchAmount = async () => {
        const amount = await paymentAmount();
        setAmountCents(amount);
      };
  
      if (lightningInvoice) {
        setIsReady(true);
        fetchAmount();
      }
    }, [lightningInvoice]);
  
    // Function to close the modal when the user clicks outside
    const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        setShowModal(false);
      }
    };
  
    // Extract the payment amount from the invoice
  
    useEffect(() => {
      let interval: NodeJS.Timeout;
  
      const verifyPayment = async () => {
        if (!lightningInvoice) return;
  
        try {
          const response = await fetch(lightningInvoice.verify);
          const result = await response.json();
  
          if (result.settled) {
            setStatus('success');
            clearInterval(interval);
            onSuccess(); // call onSuccess callback function
            setTimeout(() => setShowModal(false), 2000);
          } else {
            setStatus('pending');
          }
        } catch (error) {
          setStatus('error');
          setErrorMessage('Failed to verify payment.');
          clearInterval(interval);
        }
      };
  
      if (lightningInvoice) {
        setIsReady(true);
        interval = setInterval(verifyPayment, 1000);
      }
      return () => clearInterval(interval);
    }, [lightningInvoice, setShowModal, onSuccess]);
  
    let content = (
      <>
        {lightningInvoice && (
          <div className="rounded bg-white p-2">
            <QRCode
              value={lightningInvoice.pr}
              size={224}
              onClick={handleCopyClick}
              className="h-full w-full cursor-pointer"
            />
          </div>
        )}
      </>
    );
  
    if (status === 'success') {
      content = (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: 256,
            height: 256,
          }}
        >
          <IconCircleCheck size={128} stroke={3} color="green" />
        </div>
      );
    }
  
    return (
      <div className="z-20 fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="hidden sm:inline-block sm:h-screen sm:align-middle"
              aria-hidden="true"
            />
            <div
              ref={modalRef}
              className="inline-block max-h-[400px] transform overflow-hidden rounded-lg border border-gray-300 bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all dark:bg-[#202123] sm:my-8 sm:max-h-[600px] sm:w-full sm:max-w-lg sm:p-6 sm:align-middle"
              role="dialog"
            >
              <span
                onClick={() => setShowModal(false)}
                className="close cursor-pointer text-2xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                ×
              </span>
              <div className="content-container flex justify-center p-4">
                {content}
              </div>
              {amountCents !== null && (
                <p className="mb-2 text-center">
                  Pay ${amountCents} for the API call
                </p>
              )}
              <div className="flex justify-center">
                <button
                  id="copy-button"
                  className="focus:shadow-outline-blue rounded-l-md border border-gray-300 px-4 py-2 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:outline-none active:bg-gray-200 dark:border-neutral-500 dark:text-neutral-200 dark:hover:bg-neutral-600 dark:active:bg-neutral-700"
                  onClick={handleCopyClick}
                >
                  Copy
                </button>
                <button
                  id="open-button"
                  className="focus:shadow-outline-blue rounded-r-md border border-gray-300 bg-yellow-500 px-4 py-2 text-white transition duration-150 ease-in-out hover:bg-yellow-600 focus:outline-none active:bg-yellow-700 dark:border-yellow-500"
                  onClick={handleOpenClick}
                >
                  Open in ⚡ Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};
