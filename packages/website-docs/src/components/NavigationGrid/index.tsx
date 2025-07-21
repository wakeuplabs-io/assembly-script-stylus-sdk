import React from 'react';
import Link from '@docusaurus/Link';
import './styles.css';

interface NavigationItem {
  title: string;
  description: string;
  link: string;
}

const decorators: NavigationItem[] = [
  {
    title: '@Contract',
    description: 'Define your smart contract',
    link: '/decorators/contract'
  },
  {
    title: '@External',
    description: 'Public contract methods',
    link: '/decorators/external'
  },
  {
    title: '@View',
    description: 'Read-only methods',
    link: '/decorators/view'
  },
  {
    title: '@Event',
    description: 'Blockchain event logging',
    link: '/decorators/event'
  },
  {
    title: '@Error',
    description: 'Custom error definitions',
    link: '/decorators/error'
  },
  {
    title: 'Visibility and State Mutability',
    description: 'Method visibility control',
    link: '/decorators/visibility'
  }
];

const types: NavigationItem[] = [
  {
    title: 'U256',
    description: 'Unsigned 256-bit integers',
    link: '/types/u256'
  },
  {
    title: 'I256', 
    description: 'Signed 256-bit integers',
    link: '/types/i256'
  },
  {
    title: 'Address',
    description: 'Ethereum addresses',
    link: '/types/address'
  },
  {
    title: 'String',
    description: 'Text data handling',
    link: '/types/string'
  },
  {
    title: 'Boolean',
    description: 'Logical true/false values',
    link: '/types/boolean'
  }
];

const structures: NavigationItem[] = [
  {
    title: 'Mapping',
    description: 'Key-value storage',
    link: '/structures/mapping'
  },
  {
    title: 'Mapping2',
    description: 'Nested key-value storage',
    link: '/structures/mapping2'
  },
  {
    title: 'Struct',
    description: 'Custom data structures',
    link: '/structures/struct'
  },
];

const examples: NavigationItem[] = [
  {
    title: 'ERC20',
    description: 'Fungible token standard',
    link: '/examples/erc20'
  },
  {
    title: 'ERC721',
    description: 'Non-fungible token (NFT)',
    link: '/examples/erc721'
  }
];

export function DecoratorNavigation() {
  return (
    <div className="navigation-container">
      <h3>🎯 More Decorators</h3>
      <div className="navigation-grid">
        {decorators.map((item, index) => (
          <Link
            key={index}
            to={item.link}
            className="nav-card decorator-card"
          >
            <span className="nav-title">{item.title}</span>
            <span className="nav-desc">{item.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function TypeNavigation() {
  return (
    <div className="navigation-container">
      <h3>📦 More Data Types</h3>
      <div className="navigation-grid">
        {types.map((item, index) => (
          <Link
            key={index}
            to={item.link}
            className="nav-card type-card"
          >
            <span className="nav-title">{item.title}</span>
            <span className="nav-desc">{item.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function StructureNavigation() {
  return (
    <div className="navigation-container">
      <h3>🏗️ More Data Structures</h3>
      <div className="navigation-grid">
        {structures.map((item, index) => (
          <Link
            key={index}
            to={item.link}
            className="nav-card structure-card"
          >
            <span className="nav-title">{item.title}</span>
            <span className="nav-desc">{item.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ExampleNavigation() {
  return (
    <div className="navigation-container">
      <h3>💡 More Examples</h3>
      <div className="navigation-grid">
        {examples.map((item, index) => (
          <Link
            key={index}
            to={item.link}
            className="nav-card example-card"
          >
            <span className="nav-title">{item.title}</span>
            <span className="nav-desc">{item.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Componente por defecto (no usar)
export default function NavigationGrid() {
  return null;
} 