import tw, { styled } from 'twin.macro';

export default styled.div<{ $hoverable?: boolean }>`
    ${tw`flex rounded no-underline text-neutral-200 items-center bg-neutral-700 p-4 border border-transparent transition-colors duration-150 overflow-hidden`};

    ${props => props.$hoverable !== false && tw`hover:border-neutral-500`};

    & .icon {
        ${tw`h-10 w-10 rounded-full bg-neutral-500 flex items-center justify-center`};
    }
`;
