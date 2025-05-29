import { msg_sender } from "../modules/hostio";
import { malloc } from "../modules/memory";
import { Address } from "./address";

export class Msg {
  private constructor() {}

  public static sender(): Address {
    const msgSenderPtr = malloc(20);
    msg_sender(msgSenderPtr);
    return msgSenderPtr;
  }
}
