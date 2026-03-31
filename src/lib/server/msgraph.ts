import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import { TENANT_ID, CLIENT_ID, CLIENT_SECRET, GRAPH_SCOPES } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { createStubGraphClient } from './msgraphStub';

export async function getClient() {
    if (env.GRAPH_BACKEND === 'stub') {
        return createStubGraphClient();
    }

    const credential = new ClientSecretCredential(TENANT_ID, CLIENT_ID, CLIENT_SECRET);
    const token = await credential.getToken(GRAPH_SCOPES || 'https://graph.microsoft.com/.default');
    if (!token) throw new Error('Failed to get Microsoft Graph token');

    return Client.init({
        authProvider: (done) => done(null, token.token),
    });
}
