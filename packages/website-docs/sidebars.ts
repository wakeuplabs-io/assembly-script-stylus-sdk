import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

/**
 * Sidebar structure inspired by Hardhat's documentation organization:
 * - Version info at the top
 * - Getting Started section
 * - Main documentation sections (Guides, Reference, etc.)
 * - Examples/Cookbook
 * - Previous versions at the bottom
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    // Version selector/info at the top (similar to Hardhat's "Hardhat 3" dropdown)
    {
      type: "doc",
      id: "versions/latest",
      label: "AS-Stylus SDK v0.3.0",
    },
    {
      type: "category",
      label: "Getting Started",
      items: [
        "Getting Started/quick-start",
        "Getting Started/project-breakdown",
      ],
    },
    {
      type: "category",
      label: "Guides",
      items: [
        {
          type: "doc",
          id: "guides/deployment-overview",
          label: "Deployment overview",
        },
        {
          type: "doc",
          id: "guides/local-network",
          label: "Local Network",
        },
        {
          type: "doc",
          id: "guides/testing-contracts",
          label: "Testing Smart Contracts",
        },
      ],
      collapsed: false,
    },
    {
      type: "category",
      label: "Reference",
      items: [
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
          type: "category",
          label: "Types",
          items: [
            {
              type: "doc",
              id: "types/u256",
              label: "U256",
            },
            {
              type: "doc",
              id: "types/i256",
              label: "I256",
            },
            {
              type: "doc",
              id: "types/address",
              label: "Address",
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
          type: "doc",
          id: "inheritance",
          label: "Inheritance",
        },
        {
          type: "doc",
          id: "events",
          label: "Events",
        },
        {
          type: "doc",
          id: "errors",
          label: "Errors",
        },
        {
          type: "doc",
          id: "sending-ethers",
          label: "Sending & Receiving ETH",
        },
        {
          type: "doc",
          id: "readonly-constants",
          label: "Readonly Constants",
        },
        {
          type: "doc",
          id: "vm-affordances",
          label: "VM Affordances",
        },
      ],
    },
    {
      type: "category",
      label: "Guides",
      items: [
        {
          type: "doc",
          id: "guides/testing-contracts",
          label: "Testing Contracts",
        },
      ],
    },
    {
      type: "category",
      label: "Examples",
      items: ["examples/erc20", "examples/erc721", "examples/voting"],
    },
    // Previous versions at the bottom (similar to Hardhat's "Hardhat 2 docs" link)
    {
      type: "category",
      label: "Previous Versions",
      items: [
        {
          type: "doc",
          id: "versions/index",
          label: "Version History",
        },
        {
          type: "doc",
          id: "versions/v0.2",
          label: "v0.2.0",
        },
        {
          type: "doc",
          id: "versions/v0.1",
          label: "v0.1.0",
        },
      ],
    },
  ],
};

export default sidebars;
