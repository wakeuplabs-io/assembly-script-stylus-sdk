import { msg_sender } from "../modules/hostio";
import { malloc } from "../modules/memory";
import { address } from "./address";

export class Msg {
  private constructor() { }

  public static sender(): address {
    const msgSenderPtr = malloc(20);
    msg_sender(msgSenderPtr);
    return msgSenderPtr;
  }
}