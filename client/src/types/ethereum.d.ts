interface Window {
  ethereum: {
    isMetaMask?: boolean;
    request: (request: { method: string; params?: Array<any> }) => Promise<any>;
    on: (eventName: string, callback: (...args: any[]) => void) => void;
    removeListener: (eventName: string, callback: (...args: any[]) => void) => void;
    providers?: any[];
    selectedProvider?: any;
    chainId?: string;
    networkVersion?: string;
    _metamask?: {
      isUnlocked?: () => Promise<boolean>;
    };
  };
}