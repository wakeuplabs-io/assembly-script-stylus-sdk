import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: "category",
      label: "Getting Started",
      items: ["Getting Started/quick-start", "Getting Started/project-breakdown"],
    },
    {
      type: "category",
      label: "Decorators",
      items: [
        "decorators/contract",
        "decorators/external",
        "decorators/public",
        "decorators/internal",
        "decorators/view",
        "decorators/visibility",
      ],
    },
    {
      type: "doc",
      label: "Inheritance",
      id: "inheritance",
    },
    {
      type: "doc",
      label: "Events",
      id: "events",
    },
    {
      type: "doc",
      label: "Errors",
      id: "errors",
    },
    {
      type: "doc",
      label: "VM Affordances",
      id: "vm-affordances",
    },
    {
      type: "doc",
      label: "Sending & Receiving ETH",
      id: "sending-ethers",
    },
    {
      type: "doc",
      label: "Readonly Constants",
      id: "readonly-constants",
    },
    {
      type: "category",
      label: "Data Types",
      items: [
        {
          type: "doc",
          id: "types/u256",
          label: "Unsigned 256-bit Integer",
        },
        {
          type: "doc",
          id: "types/i256",
          label: "Signed 256-bit Integer",
        },
        {
          type: "doc",
          id: "types/address",
          label: "Ethereum Address",
        },
        {
          type: "doc",
          id: "types/string",
          label: "String",
        },
        {
          type: "doc",
          id: "types/boolean",
          label: "Boolean",
        },
      ],
    },
    {
      type: "category",
      label: "Data Structures",
      items: [
        {
          type: "doc",
          id: "structures/mapping",
          label: "Mapping",
        },
        {
          type: "doc",
          id: "structures/mapping2",
          label: "Nested Mapping",
        },
        {
          type: "doc",
          id: "structures/struct",
          label: "Struct",
        },
      ],
    },
    {
      type: "category",
      label: "Examples",
      items: ["examples/erc20", "examples/erc721"],
    },
    {
      type: "category",
      label: "Versions",
      items: [
        {
          type: "doc",
          id: "versions/index",
          label: "Version History",
        },
        {
          type: "doc",
          id: "versions/latest",
          label: "Latest Release (v0.1.0 Alpha)",
        },
      ],
    },
  ],
};

export default sidebars;
