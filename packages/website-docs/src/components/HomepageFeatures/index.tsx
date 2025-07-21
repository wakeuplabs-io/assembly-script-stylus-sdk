import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'AssemblyScript for Smart Contracts',
    description: (
      <>
        TypeScript-like syntax for Arbitrum Stylus. 
        High performance, low gas costs.
      </>
    ),
  },
  {
    title: 'Type-Safe Development', 
    description: (
      <>
        <code>U256</code>, <code>I256</code>, <code>Address</code>, <code>String</code> types.
        Compile-time safety, catch errors early.
      </>
    ),
  },
  {
    title: 'Simple Decorators',
    description: (
      <>
        <code>@Contract</code>, <code>@External</code>, <code>@View</code> decorators.
        Start coding contracts immediately.
      </>
    ),
  },
];

function Feature({title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className={clsx('text--center padding-horiz--md', styles.featureItem)}>
        <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
        <p className={styles.featureDescription}>{description}</p>
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
