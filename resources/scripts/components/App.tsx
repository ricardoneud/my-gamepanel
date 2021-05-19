import React, { lazy, useEffect, Suspense } from 'react';
import ReactGA from 'react-ga';
import { hot } from 'react-hot-loader/root';
import { Route, Router, Switch, useLocation } from 'react-router-dom';
import { StoreProvider } from 'easy-peasy';
import { store } from '@/state';
import DashboardRouter from '@/routers/DashboardRouter';
import ServerRouter from '@/routers/ServerRouter';
import AuthenticationRouter from '@/routers/AuthenticationRouter';
import { SiteSettings } from '@/state/settings';
import ProgressBar from '@/components/elements/ProgressBar';
import { NotFound } from '@/components/elements/ScreenBlock';
import tw from 'twin.macro';
import GlobalStylesheet from '@/assets/css/GlobalStylesheet';
import { history } from '@/components/history';
import { setupInterceptors } from '@/api/interceptors';
import TailwindGlobalStyles from '@/components/GlobalStyles';

const ChunkedAdminRouter = lazy(() => import(/* webpackChunkName: "admin" */'@/routers/AdminRouter'));

interface ExtendedWindow extends Window {
    SiteConfiguration?: SiteSettings;
    PterodactylUser?: {
        uuid: string;
        username: string;
        email: string;
        /* eslint-disable camelcase */
        name_first: string;
        name_last: string;
        root_admin: boolean;
        use_totp: boolean;
        language: string;
        avatar_url: string;
        role_name: string;
        updated_at: string;
        created_at: string;
        /* eslint-enable camelcase */
    };
}

setupInterceptors(history);

const Pageview = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        ReactGA.pageview(pathname);
    }, [ pathname ]);

    return null;
};

const App = () => {
    const { PterodactylUser, SiteConfiguration } = (window as ExtendedWindow);
    if (PterodactylUser && !store.getState().user.data) {
        store.getActions().user.setUserData({
            uuid: PterodactylUser.uuid,
            username: PterodactylUser.username,
            email: PterodactylUser.email,
            firstName: PterodactylUser.name_first,
            lastName: PterodactylUser.name_last,
            language: PterodactylUser.language,
            rootAdmin: PterodactylUser.root_admin,
            useTotp: PterodactylUser.use_totp,
            avatarURL: PterodactylUser.avatar_url,
            roleName: PterodactylUser.role_name,
            createdAt: new Date(PterodactylUser.created_at),
            updatedAt: new Date(PterodactylUser.updated_at),
        });
    }

    if (!store.getState().settings.data) {
        store.getActions().settings.setSettings(SiteConfiguration!);
    }

    useEffect(() => {
        if (SiteConfiguration?.analytics) {
            ReactGA.initialize(SiteConfiguration!.analytics);
        }
    }, []);

    return (
        <>
            <GlobalStylesheet/>
            <TailwindGlobalStyles/>
            <StoreProvider store={store}>
                <ProgressBar/>

                <div css={tw`mx-auto w-auto`}>
                    <Router history={history}>
                        <Suspense fallback={<div>Loading...</div>}>
                            {SiteConfiguration?.analytics && <Pageview/>}
                            <Switch>
                                <Route path="/server/:id" component={ServerRouter}/>
                                <Route path="/auth" component={AuthenticationRouter}/>
                                <Route path="/admin" component={ChunkedAdminRouter}/>
                                <Route path="/" component={DashboardRouter}/>
                                <Route path={'*'} component={NotFound}/>
                            </Switch>
                        </Suspense>
                    </Router>
                </div>
            </StoreProvider>
        </>
    );
};

export default hot(App);
