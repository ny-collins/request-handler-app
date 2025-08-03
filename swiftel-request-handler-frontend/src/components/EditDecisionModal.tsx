import Button from './ui/Button';
import { Decision } from '../types';

interface EditDecisionModalProps {
  payload: {
    requestId: number;
    boardMemberId: number;
    currentDecision: Decision['decision'];
  };
  onClose: () => void;
  onSave: (newDecision: Decision['decision']) => void;
  isSaving: boolean;
}

const EditDecisionModal = ({ payload, onClose, onSave, isSaving }: EditDecisionModalProps) => {
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Edit Decision</h2>
        <p>
          You are editing the decision for request ID: <strong>{payload.requestId}</strong>.
        </p>
        <p>
          The current decision is: <strong className={`decision-text-${payload.currentDecision}`}>{payload.currentDecision.toUpperCase()}</strong>
        </p>
        <p>Choose a new decision:</p>
        <div className="modal-actions">
          <Button
            variant="approve"
            onClick={() => onSave('approved')}
            disabled={isSaving || payload.currentDecision === 'approved'}
            className="btn-flex-grow"
          >
            {isSaving ? 'Saving...' : 'Approve'}
          </Button>
          <Button
            variant="reject"
            onClick={() => onSave('rejected')}
            disabled={isSaving || payload.currentDecision === 'rejected'}
            className="btn-flex-grow"
          >
            {isSaving ? 'Saving...' : 'Reject'}
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSaving}
            className="btn-flex-grow"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditDecisionModal;
