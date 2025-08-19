// Pinata IPFS Service
export interface PinataMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export class PinataService {
  private apiKey: string;
  private secretKey: string;

  constructor() {
    // Use environment variables if available, otherwise use hardcoded keys
    this.apiKey = import.meta.env.VITE_PINATA_API_KEY || '*';
    this.secretKey = import.meta.env.VITE_PINATA_SECRET_API_KEY || '*';
  }

  async uploadImage(imageBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', imageBlob);

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.secretKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Pinata upload error:', errorText);
        throw new Error(`Failed to upload image to Pinata: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      return `ipfs://${result.IpfsHash}`;
    } catch (error) {
      console.error('Error uploading image to Pinata:', error);
      throw error;
    }
  }

  async uploadMetadata(metadata: PinataMetadata): Promise<string> {
    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.secretKey,
        },
        body: JSON.stringify({
          pinataMetadata: {
            name: metadata.name,
          },
          pinataContent: metadata,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Pinata metadata upload error:', errorText);
        throw new Error(`Failed to upload metadata to Pinata: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      return `ipfs://${result.IpfsHash}`;
    } catch (error) {
      console.error('Error uploading metadata to Pinata:', error);
      throw error;
    }
  }

  async createGiftCardNFT(
    amount: string,
    currency: string,
    message: string,
    design: string,
    imageBlob: Blob
  ): Promise<string> {
    try {

      
      // 1. Upload image to IPFS

      const imageUri = await this.uploadImage(imageBlob);


      // 2. Create metadata
      const metadata: PinataMetadata = {
        name: `Gift Card - ${amount} ${currency}`,
        description: `A digital gift card worth ${amount} ${currency}. ${message}`,
        image: imageUri,
        attributes: [
          {
            trait_type: 'Amount',
            value: amount,
          },
          {
            trait_type: 'Currency',
            value: currency,
          },
          {
            trait_type: 'Design',
            value: design,
          },
          {
            trait_type: 'Message',
            value: message,
          },
        ],
      };

      // 3. Upload metadata to IPFS

      const metadataUri = await this.uploadMetadata(metadata);


      return metadataUri;
    } catch (error) {
      console.error('Error creating gift card NFT:', error);
      throw error;
    }
  }
}

export default new PinataService();
