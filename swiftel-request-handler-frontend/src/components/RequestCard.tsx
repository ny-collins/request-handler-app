import { FiEdit } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import Button from './ui/Button';
import { Decision, Request } from '../types';

interface RequestCardProps {
  request: Request;
  onDecision: (requestId: number, decision: 'approved' | 'rejected') => void;
  onEditDecision: (payload: { requestId: number, boardMemberId: number, currentDecision: Decision['decision'] }) => void;
}

const RequestCard = ({ request, onDecision, onEditDecision }: RequestCardProps) => {
  const { user } = useAuth();
  const isBoardMember = user?.role === 'board_member';
  const isAdmin = user?.role === 'admin';

  const myDecision = request.decisions?.find(
    (d) => d.board_member_id === user?.id
  );

  const canEditOwnDecision = isBoardMember && request.status === 'pending' && myDecision;
  const canAdminEdit = isAdmin;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: any) => {
    const parsed = Number(amount);
    return Number.isFinite(parsed)
      ? parsed.toLocaleString('en-KE', {
          style: 'currency',
          currency: 'KES',
        })
      : 'Invalid amount';
  };

  const handleEditClick = (boardMemberId: number, decision: Decision['decision']) => {
      onEditDecision({ requestId: request.id, boardMemberId, currentDecision: decision });
  };

  return (
    <div className="request-card">
      <div className="request-card-header">
        <div>
          <h3>{request.title}</h3>
          {request.employee_username && (
            <small>By: {request.employee_username}</small>
          )}
        </div>
        <span className={`request-status status-${request.status}`}>
          {request.status.toUpperCase()}
        </span>
      </div>

      <div className="request-card-body">
        <p>{request.description}</p>
        <small>Submitted on: {formatDate(request.created_at)}</small>
        {request.is_monetary && (
          <p>
            <strong>Amount: {formatAmount(request.amount)}</strong>
          </p>
        )}
      </div>

      {/* Decisions Section (for Board Members & Admins) */}
      {request.decisions && (isBoardMember || isAdmin) && (
        <div className="decisions-section">
          <h4>Board Decisions:</h4>
          {request.decisions.length > 0 ? (
            <ul>
              {request.decisions.map((d) => (
                <li
                  key={d.board_member_id}
                  className={`decision-item decision-${d.decision}`}>
                  <span>
                    {d.username}:{' '}
                    <strong>{d.decision.toUpperCase()}</strong>
                  </span>
                  {(canAdminEdit || (canEditOwnDecision && d.board_member_id === user?.id)) && (
                    <FiEdit
                      cursor="pointer"
                      onClick={() => handleEditClick(d.board_member_id, d.decision)}
                    />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No decisions yet.</p>
          )}
        </div>
      )}

      {/* Actions Footer */}
      {isBoardMember && !myDecision && request.status === 'pending' && (
        <div className="request-card-footer">
          <div className="request-card-actions">
            <Button
              variant="approve"
              onClick={() => onDecision(request.id, 'approved')}
              className="btn-sm btn-flex-grow"
            >
              Approve
            </Button>
            <Button
              variant="reject"
              onClick={() => onDecision(request.id, 'rejected')}
              className="btn-sm btn-flex-grow"
            >
              Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestCard;
