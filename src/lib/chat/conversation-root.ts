import { getDb } from "../db";
import { ConversationDataMapper } from "../../adapters/ConversationDataMapper";
import { MessageDataMapper } from "../../adapters/MessageDataMapper";
import { ConversationInteractor } from "../../core/use-cases/ConversationInteractor";

export function getConversationInteractor(): ConversationInteractor {
  const db = getDb();
  const conversationRepo = new ConversationDataMapper(db);
  const messageRepo = new MessageDataMapper(db);
  return new ConversationInteractor(conversationRepo, messageRepo);
}
