import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import { TENANT_ID, CLIENT_ID, CLIENT_SECRET, GRAPH_SCOPES } from '$env/static/private';

export async function getClient() {
    const credential = new ClientSecretCredential(TENANT_ID, CLIENT_ID, CLIENT_SECRET);
    const token = await credential.getToken(GRAPH_SCOPES || 'https://graph.microsoft.com/.default');
    if (!token) throw new Error('Failed to get Microsoft Graph token');

    return Client.init({
        authProvider: (done) => done(null, token.token),
    });
}
