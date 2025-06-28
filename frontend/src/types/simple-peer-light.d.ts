declare module 'simple-peer-light' {
  interface SimplePeerData {
    initiator?: boolean;
    stream?: MediaStream;
    trickle?: boolean;
    config?: {
      iceServers: RTCIceServer[];
    };
  }

  class SimplePeer {
    constructor(opts: SimplePeerData);
    on(event: string, listener: Function): this;
    signal(data: any): void;
    destroy(): void;
  }

  export = SimplePeer;
} 