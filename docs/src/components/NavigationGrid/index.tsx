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
    link: '/docs/decorators/contract'
  },
  {
    title: '@External',
    description: 'Public contract methods',
    link: '/docs/decorators/external'
  },
  {
    title: '@View',
    description: 'Read-only methods',
    link: '/docs/decorators/view'
  },
  {
    title: '@Visibility',
    description: 'Method visibility control',
    link: '/docs/decorators/visibility'
  }
];

const types: NavigationItem[] = [
  {
    title: 'U256',
    description: 'Unsigned 256-bit integers',
    link: '/docs/types/u256'
  },
  {
    title: 'I256', 
    description: 'Signed 256-bit integers',
    link: '/docs/types/i256'
  },
  {
    title: 'Address',
    description: 'Ethereum addresses',
    link: '/docs/types/address'
  },
  {
    title: 'String',
    description: 'Text data handling',
    link: '/docs/types/string'
  },
  {
    title: 'Boolean',
    description: 'Logical true/false values',
    link: '/docs/types/boolean'
  }
];

const structures: NavigationItem[] = [
  {
    title: 'Mapping',
    description: 'Key-value storage',
    link: '/docs/structures/mapping'
  },
  {
    title: 'Mapping2',
    description: 'Nested key-value storage',
    link: '/docs/structures/mapping2'
  },
  {
    title: 'Struct',
    description: 'Custom data structures',
    link: '/docs/structures/struct'
  },
  {
    title: 'Event',
    description: 'Blockchain event logging',
    link: '/docs/structures/event'
  },
  {
    title: 'Error',
    description: 'Custom error definitions',
    link: '/docs/structures/error'
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

// Componente por defecto (no usar)
export default function NavigationGrid() {
  return null;
} 