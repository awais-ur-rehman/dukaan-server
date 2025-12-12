import { type IMerchant } from '../../models/Merchant';

export interface MerchantResponse extends Omit<IMerchant, 'ownerUserId' | 'riders'> {
  ownerUserId: string;
  riders: string[];
}

export interface PaginatedMerchants {
  items: MerchantResponse[];
  total: number;
  page: number;
  limit: number;
}

