import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';
import { versions } from '../../environments/versions';
import { ServerListApiService } from './Api/ServerListApiService';
import { Toolbox } from './Toolbox';
import { BrowserContextService } from './BrowserContextService';
import { ServerManager } from '../Repos/ServerManager';
import { ServersRepo } from '../Repos/ServersRepo';

@Injectable({
    providedIn: 'root'
})

export class CheckService {
    public checking = false;
    public version = versions.version;
    public revision = versions.revision;
    public buildTime = versions.buildTime;

    constructor(
        private broswerContext: BrowserContextService,
        private serverListApiService: ServerListApiService,
        private serverRepo: ServerManager,
        private serversRepo: ServersRepo
    ) {
        if (this.broswerContext.supportWebPush()) {
            navigator.serviceWorker.addEventListener('message', (t: MessageEvent) => {
                if (t.data === '__Update_Completed__') {
                    Swal.fire({
                        title: 'Update Completed',
                        html: 'Refresh to apply your upgrade.<br/>Do you want to refresh now?',
                        icon: 'success',
                        showConfirmButton: true,
                        confirmButtonText: 'Refresh',
                        showCancelButton: true,
                        cancelButtonText: 'Later'
                    }).then(t_ => {
                        if (t_.value) {
                            document.location.reload();
                        }
                    });
                }
            });
        }
    }

    public async checkAndAlertAppVersion(showAlert: boolean): Promise<void> {
        this.checking = true;
        const globalVersion = await this.serverListApiService.Version();
        if (Toolbox.compareVersion(globalVersion.latestVersion, versions.version) > 0) {
            await this.redirectToDownload(globalVersion.downloadAddress, showAlert);
        } else if (showAlert) {
            Swal.fire('Success', 'You are running the latest version of Kahla!', 'success');
        }
        this.checking = false;
    }

    public async checkAndAlertApiVersion(): Promise<void> {
        const selectedServerConfig = await this.serverRepo.getOurServer(false);
        const delta = Toolbox.compareVersion(selectedServerConfig.apiVersion, versions.version);
        if (delta === 1 || delta === 2) {
            Swal.fire('Outdated client.', 'Your Kahla App is too far from the version of the server connected.\n' +
                'Kahla might not work properly if you don\'t upgrade.', 'warning');
        } else if (delta < 0 && !await this.serversRepo.isOfficialServer(selectedServerConfig.domain.server)) {
            Swal.fire('Community server outdated!', 'The Client version is newer then the Server version.\n' +
                'Consider contact the host of the server for updating the kahla.server version to latest.', 'warning');
        }
    }

    private async redirectToDownload(downloadAddress: string, showAlert: boolean = false): Promise<void> {
        if (this.broswerContext.isElectron()) {
            const downloadIt = await Swal.fire({
                title: 'There is a new version of Kahla!',
                text: 'Do you want to download the latest version of Kahla now?',
                icon: 'warning',
                confirmButtonText: 'Download now',
                cancelButtonText: 'Remind me later',
                showCancelButton: true
            });
            if (downloadIt.value) {
                this.broswerContext.openWebPage(downloadAddress);
            }
        } else if (this.broswerContext.supportWebPush()) {
            this.updateServiceWorkerCache();
            if (showAlert) {
                Swal.fire({
                    title: 'There is a new version of Kahla!',
                    text: 'We are upgrading automatically at the background.\n You will be notified when done.',
                    icon: 'warning'
                });
            }
        } else {
            // in a browser without serviceworker
            Swal.fire({
                title: 'There is a new version of Kahla!',
                text: 'Please refresh(Ctrl + F5) or reopen this page to use the latest version.',
                icon: 'warning'
            });
        }
    }

    public updateServiceWorkerCache() {
        navigator.serviceWorker.controller.postMessage('__Update_Required__');
    }
}
