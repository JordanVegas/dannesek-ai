export enum Role {
  User = 0,
  Bot = 1,
}

export interface Message {
  role: Role;
  content: string | React.ReactNode;
  imageUrl?: string;
}


export interface Chat {
  id: number;
  title: string;
}
