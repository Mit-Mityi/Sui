// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useFeature } from '@growthbook/growthbook-react';
import cl from 'classnames';
import { useEffect, useMemo } from 'react';

import { useActiveAddress } from '../../hooks/useActiveAddress';
import { useBackgroundClient } from '../../hooks/useBackgroundClient';
import { permissionsSelectors } from '../../redux/slices/permissions';
import Loading from '../loading';
import { type DAppEntry, SuiApp } from './SuiApp';
import { SuiAppEmpty } from './SuiAppEmpty';
import { Heading } from '_app/shared/heading';
import { Text } from '_app/shared/text';
import { useAppSelector } from '_hooks';
import { FEATURES } from '_src/shared/experimentation/features';
import { prepareLinkToCompare } from '_src/shared/utils';

import st from './Playground.module.scss';

const emptyArray: DAppEntry[] = [];

function ConnectedDapps() {
	const backgroundClient = useBackgroundClient();
	useEffect(() => {
		backgroundClient.sendGetPermissionRequests();
	}, [backgroundClient]);
	const ecosystemApps = useFeature<DAppEntry[]>(FEATURES.WALLET_DAPPS).value ?? emptyArray;
	const loading = useAppSelector(({ permissions }) => !permissions.initialized);
	const allPermissions = useAppSelector(permissionsSelectors.selectAll);
	const activeAddress = useActiveAddress();
	const connectedApps = useMemo(
		() =>
			allPermissions
				.filter(({ allowed, accounts }) => allowed && accounts.includes(activeAddress!))
				.map((aPermission) => {
					const matchedEcosystemApp = ecosystemApps.find((anEcosystemApp) => {
						const originAdj = prepareLinkToCompare(aPermission.origin);
						const pageLinkAdj = aPermission.pagelink
							? prepareLinkToCompare(aPermission.pagelink)
							: null;
						const anEcosystemAppLinkAdj = prepareLinkToCompare(anEcosystemApp.link);
						return originAdj === anEcosystemAppLinkAdj || pageLinkAdj === anEcosystemAppLinkAdj;
					});
					let appNameFromOrigin = '';
					try {
						appNameFromOrigin = new URL(aPermission.origin).hostname
							.replace('www.', '')
							.split('.')[0];
					} catch (e) {
						// do nothing
					}
					return {
						name: aPermission.name || appNameFromOrigin,
						description: '',
						icon: aPermission.favIcon || '',
						link: aPermission.pagelink || aPermission.origin,
						tags: [],
						// override data from ecosystemApps
						...matchedEcosystemApp,
						permissionID: aPermission.id,
					};
				}),
		[activeAddress, allPermissions, ecosystemApps],
	);
	return (
		<Loading loading={loading}>
			<div className="flex justify-center">
				<Heading variant="heading6" color="gray-90" weight="semibold">
					Active Connections
				</Heading>
			</div>
			<div className="my-4">
				<Text variant="pBodySmall" color="gray-80" weight="normal">
					Apps you have connected to through the Sui Wallet in this browser.
				</Text>
			</div>

			<div className={cl(st.apps, st.appCards)}>
				{connectedApps.length ? (
					connectedApps.map((app) => <SuiApp key={app.permissionID} {...app} displayType="card" />)
				) : (
					<>
						<SuiAppEmpty displayType="card" />
						<SuiAppEmpty displayType="card" />
					</>
				)}
			</div>
		</Loading>
	);
}

export default ConnectedDapps;
