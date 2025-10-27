import { CreatePreferenceDTO, IWebhookPayload, IWebhookQuery, ListPaymentsFilter, UpdatePaymentDTO } from '../interfaces/payment.interface.js';

export interface PaymentService {
  createPreference(data: CreatePreferenceDTO): Promise<any>;
  list(filter?: ListPaymentsFilter): Promise<any>;
  getById(id: string): Promise<any>;
  updateById(id: string, data: UpdatePaymentDTO): Promise<any>;
  processWebhook(body: IWebhookPayload, query?: IWebhookQuery): Promise<any>;
}
