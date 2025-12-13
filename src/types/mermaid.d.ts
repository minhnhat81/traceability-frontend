declare module "mermaid" {
  export function initialize(config: any): void;
  export function run(args?: any): void;
  export function render(id: string, code: string): Promise<{ svg: string }>;
}
