import { Types } from "mongoose";

export type PaymentStatus =
  | "pending"
  | "approved"
  | "authorized"
  | "in_process"
  | "in_mediation"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back";

export interface IPaymentItem {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
}

export interface IPayment {
  id?: string | Types.ObjectId;
  user?: string | Types.ObjectId;
  items: IPaymentItem[];
  amount: number;
  currency_id: string;
  preferenceId: string;
  paymentId?: string;
  status: PaymentStatus;
  payerEmail?: string;
  createdBy: string | Types.ObjectId;
  updatedBy?: string | Types.ObjectId;
  fech_creacion?: Date;
  fech_modif?: Date;
}

export interface CreatePreferenceDTO {
  items: {
    id?: string;
    title: string;
    quantity: number;
    unit_price: number;
    currency_id?: string;
  }[];
  payer?: {
    email?: string;
    name?: string;
    surname?: string;
  };
  createdBy?: string;
}


export interface ListPaymentsFilter {
  page?: number;
  limit?: number;
  status?: PaymentStatus | string;
  user?: string | Types.ObjectId;
}

export interface UpdatePaymentDTO {
  status?: PaymentStatus | string;
  paymentId?: string;
  payerEmail?: string;
  items?: IPaymentItem[];
  updatedBy?: string;
}

export interface IWebhookPayload {
  action?: string;
  type?: string;
  data?: { id?: string };
  id?: string;
}

export interface IWebhookQuery {
  type?: string;
  topic?: string;
  "data.id"?: string;
}
