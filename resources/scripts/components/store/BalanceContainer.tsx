import tw from 'twin.macro';
import { breakpoint } from '@/theme';
import styled from 'styled-components/macro';
import { useStoreState } from '@/state/hooks';
import React, { useEffect, useState } from 'react';
import ContentBox from '@/components/elements/ContentBox';
import StoreError from '@/components/store/error/StoreError';
import { getResources, Resources } from '@/api/store/getResources';
import PageContentBlock from '@/components/elements/PageContentBlock';
import StripePurchaseForm from '@/components/store/forms/StripePurchaseForm';
import PaypalPurchaseForm from '@/components/store/forms/PaypalPurchaseForm';

const Container = styled.div`
    ${tw`flex flex-wrap`};

    & > div {
        ${tw`w-full`};

        ${breakpoint('sm')`
      width: calc(50% - 1rem);
    `}

        ${breakpoint('md')`
      ${tw`w-auto flex-1`};
    `}
    }
`;

const BalanceContainer = () => {
    const [resources, setResources] = useState<Resources>();
    const store = useStoreState((state) => state.storefront.data!);

    useEffect(() => {
        getResources().then((resources) => setResources(resources));
    }, []);

    if (!resources) return <StoreError />;

    return (
        <PageContentBlock title={'Account Balance'}>
            <h1 css={tw`text-5xl`}>Account Balance</h1>
            <h3 css={tw`text-2xl mt-2 text-neutral-500`}>Purchase credits easily via Stripe or PayPal.</h3>
            <Container css={tw`lg:grid lg:grid-cols-2 my-10`}>
                <div>
                    <ContentBox title={'Account Balance'} showFlashes={'account:balance'} css={tw`sm:mt-0`}>
                        <h1 css={tw`text-7xl flex justify-center items-center`}>
                            ${resources.balance} {store.currency}
                        </h1>
                    </ContentBox>
                    {/*
                        <ContentBox
                            title={'Transaction History'}
                            showFlashes={'account:balance'}
                            css={tw`mt-8`}
                        >
                            <GreyRowBox>
                                <p css={tw`flex-initial text-lg ml-2`}>
                                    #OQ73
                                </p>
                                <p css={tw`flex-1 text-sm ml-4 inline-block`}>
                                    <code css={tw`font-mono py-1 px-2 md:bg-neutral-900 rounded mr-2`}>
                                        1000 credits purchased.
                                    </code>
                                </p>
                                <div css={tw`flex-initial text-xs ml-4 hidden md:block overflow-hidden`}>
                                    <p css={tw`text-sm break-words`}>PayPal</p>
                                    <p css={tw`text-2xs text-neutral-300 uppercase`}>
                                        MAY 25TH, 2022 23:30
                                    </p>
                                </div>
                            </GreyRowBox>
                        </ContentBox>
                    */}
                </div>
                <ContentBox title={'Purchase credits'} showFlashes={'account:balance'} css={tw`mt-8 sm:mt-0 sm:ml-8`}>
                    {store.gateways?.paypal === 'true' && <PaypalPurchaseForm />}
                    {store.gateways?.stripe === 'true' && <StripePurchaseForm />}
                </ContentBox>
            </Container>
        </PageContentBlock>
    );
};

export default BalanceContainer;