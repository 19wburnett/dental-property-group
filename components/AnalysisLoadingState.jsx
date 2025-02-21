const AnalysisLoadingState = ({ message }) => {
  return (
    <div className="analysis-loading">
      <div className="spinner"></div>
      <p className="message">{message}</p>

      <style jsx>{`
        .analysis-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #0070f3;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        .message {
          color: #666;
          font-size: 1.1rem;
          margin: 0;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AnalysisLoadingState;
