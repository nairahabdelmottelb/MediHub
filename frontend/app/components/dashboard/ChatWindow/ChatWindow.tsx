import "./ChatWindow.css";

interface ChatModalProps {
  show: boolean;
  handleClose: () => void;
}

export default function ChatModal(props: ChatModalProps) {
  return (
    <div className={`chat-window ${props.show ? "show" : ""}`}>
      <div className="d-flex justify-content-between align-items-center p-2 bg-primary text-white">
        <h5 className="mb-0">
          <i className="fas fa-robot me-2 lh-1" />
          MediBot
        </h5>

        <button
          type="button"
          className="btn-close btn-close-white"
          onClick={() => props.handleClose()}
        />
      </div>

      <div
        className="chat-body"
      >
        <div className="bot-message alert alert-secondary">
          Hello! I'm MediBot. How can I assist you today?
        </div>
      </div>

      <form className="chat-form">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Type your message..."
            id="chatInput"
          />
          <button className="btn btn-success" type="button" id="btnSend">
            <i className="fas fa-paper-plane" />
          </button>
        </div>
      </form>
    </div>
  );
}
