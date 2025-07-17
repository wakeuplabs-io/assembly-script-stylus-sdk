import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'AssemblyScript for Smart Contracts',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Build high-performance smart contracts for Arbitrum Stylus using AssemblyScript. 
        Enjoy familiar TypeScript-like syntax with near-native execution speed and 
        significantly lower gas costs compared to traditional EVM contracts.
      </>
    ),
  },
  {
    title: 'Type-Safe Development',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Work with robust data types like <code>U256</code>, <code>I256</code>, <code>Address</code>, 
        and <code>String</code> that provide compile-time safety and runtime efficiency. 
        Catch errors early and write more reliable smart contracts with strong typing.
      </>
    ),
  },
  {
    title: 'Developer-Friendly Tooling',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Complete SDK with decorators like <code>@Contract</code>, <code>@External</code>, 
        and <code>@View</code> for intuitive smart contract development. 
        Built-in testing, deployment tools, and comprehensive documentation to get you started quickly.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
