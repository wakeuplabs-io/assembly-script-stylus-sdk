import { msg_sender } from "../modules/hostio";
import { malloc } from "../modules/memory";

export class Msg {
  private constructor() {}

  public static sender(): usize {
    const msgSenderPtr = malloc(20);
    msg_sender(msgSenderPtr);
    return msgSenderPtr;
  }
}
