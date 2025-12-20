import { Dropdown } from 'react-bootstrap';

const ChannelItem = ({ channel, currentChannelId, onChannelClick, onRename, onRemove }) => {
  const isActive = currentChannelId === channel.id;

  return (
    <div
      role="listitem"
      className={`d-flex align-items-stretch px-2 py-1 channel-item ${isActive ? 'bg-light' : ''}`}
    >
      <button
        type="button"
        className="flex-grow-1 text-start btn btn-link text-decoration-none text-dark py-2"
        onClick={() => onChannelClick(channel.id)}
        aria-current={isActive ? 'true' : 'false'}
        style={{ borderRadius: '0' }}
      >
        <strong>#</strong> {channel.name}
      </button>

      {channel.removable && (
        <Dropdown align="end" className="d-inline">
          <Dropdown.Toggle
            variant="link"
            bsPrefix="p-0"
            className="text-muted shadow-none border-0 dropdown-toggle-no-caret"
            id={`dropdown-channel-${channel.id}`}
            style={{ lineHeight: '1' }}
          >
            <span className="visually-hidden">Управление каналом</span>
            ⋮
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Item
              onClick={() => onRename(channel.id)}
            >
              Переименовать
            </Dropdown.Item>
            <Dropdown.Item
              onClick={() => onRemove(channel.id)}
              className="text-danger"
            >
              Удалить
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      )}
    </div>
  );
};

export default ChannelItem;
