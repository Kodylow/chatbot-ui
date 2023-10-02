import { IconPlus } from '@tabler/icons-react';
import { FC } from 'react';

import { Conversation } from '@/types/chat';

interface Props {
    selectedConversation: Conversation;
    onNewConversation: () => void;
}

export const Navbar: FC<Props> = ({
    selectedConversation,
    onNewConversation,
}) => {
    if (selectedConversation.messages.length > 0) {
        return (
            <nav className="flex w-full justify-between bg-[#202123] py-3 px-4">
                <div className="mr-4"></div>

                <div className="max-w-[240px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {selectedConversation.name}
                </div>

                <IconPlus
                    className="cursor-pointer hover:text-neutral-400 mr-8"
                    onClick={onNewConversation}
                />
            </nav>
        )
    } else {
        return (
            <nav className="flex w-full justify-center bg-[#202123] py-3 px-4">

                <div className="max-w-[240px] text-center overflow-hidden text-ellipsis whitespace-nowrap">
                    {selectedConversation.name}
                </div>

            </nav>
        );
    }
};
