declare module '@babel/traverse' {
  import { Node } from '@babel/types';

  export interface NodePath<T = Node> {
    node: T;
    parent: Node;
    parentPath: NodePath | null;
    scope: any;
    hub: any;
    data: any;
    key: string | number;
    listKey: string;
    inList: boolean;
    container: any;
    contexts: any[];
  }

  export interface Visitor<T = Node> {
    enter?(path: NodePath<T>): void;
    exit?(path: NodePath<T>): void;
    [key: string]: ((path: NodePath) => void) | undefined;
  }

  function traverse(
    parent: Node,
    opts?: Visitor,
    scope?: any,
    state?: any,
    parentPath?: NodePath
  ): void;
  export default traverse;
}
