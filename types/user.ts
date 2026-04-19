export interface User {
  id: string; //string вместо number чтобы генерировать uuid на клиент
  name: string;
  weightKg: number;
  createdAt: number;
}