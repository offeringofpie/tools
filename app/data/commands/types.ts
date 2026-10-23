type Option = { label: string; [key: string]: string };

export type Field =
  | {
      kind?: 'text' | 'textarea';
      label: string;
      placeholder: string;
      optional?: boolean;
      spaces?: 'keep';
    }
  | {
      kind: 'select';
      label: string;
      initial?: string;
      options: Option[];
    }
  | {
      kind: 'tags';
      label: string;
      placeholder: string;
    }
  | {
      kind: 'time';
      label: string;
      initial: string;
    };

type Flag = { label: string; value: string; on?: boolean };

export type Task = {
  title: string;
  fields: Record<string, Field>;
  layout?: string[][];
  flags?: Record<string, Flag>;
  script: string[];
};

export type CommandApp = {
  name: string;
  docs: string;
  note?: string;
  cluster?: boolean;
  tasks: Task[];
  tricks?: Task[];
};

export type Values = {
  fields: Record<string, string | string[]>;
  flags: string[];
};

export type Reader = {
  text: (id: string) => string;
  list: (id: string) => string[];
  on: (id: string) => boolean;
};

export type Context = {
  task: Task;
  read: Reader;
  item: string;
};

export type Word = {
  kind: 'flag' | 'value';
  text: string;
};

export type ReadoutRow = {
  kind: 'program' | 'flag' | 'option' | 'argument';
  flag: string;
  value: string;
};

export type ReadoutStep = {
  comment: string;
  rows: ReadoutRow[];
};
