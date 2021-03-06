// Obsolete. Will be removed.
import { ContactInfo } from './ContactInfo';
import { Request } from './Request';
import { SearchResult } from './SearchResult';
import { KahlaUser } from './KahlaUser';
import { Conversation } from './Conversation';
import { AccessToken } from './AccessToken';

export class CacheModel {
    public static readonly VERSION = 4;
    public version = CacheModel.VERSION;
    public me: KahlaUser;
    public conversations: ContactInfo[];
    public friends: SearchResult;
    public requests: Request[];
    public conversationDetail: Map<number, Conversation> = new Map<number, Conversation>();
    public probeTokens: Map<number, AccessToken> = new Map<number, AccessToken>();
}
