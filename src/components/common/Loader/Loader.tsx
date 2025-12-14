import './Loader.css';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const Loader = ({ size = 'md', message }: LoaderProps) => {
  return (
    <div className={`loader loader--${size}`}>
      <div className="loader__spinner">
        <div className="loader__spinner-ring"></div>
        <div className="loader__spinner-ring"></div>
        <div className="loader__spinner-ring"></div>
      </div>
      {message && <p className="loader__message">{message}</p>}
    </div>
  );
};

export default Loader;

