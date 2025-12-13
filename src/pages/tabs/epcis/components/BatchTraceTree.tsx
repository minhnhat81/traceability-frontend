import { Tree } from "antd";

function toTreeData(node) {
  return {
    title: `${node.code} — ${node.quantity}${node.unit} (Used: ${node.used}, Remain: ${node.remaining})`,
    key: node.code,
    children: node.children?.map(toTreeData) || [],
  };
}

export default function BatchTraceTree({ data }) {
  const treeData = data ? [toTreeData(data)] : [];
  return (
    <div style={{ padding: 16 }}>
      <Tree treeData={treeData} defaultExpandAll showLine />
    </div>
  );
}
