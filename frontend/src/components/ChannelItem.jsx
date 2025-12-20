import { Dropdown } from 'react-bootstrap';

const ChannelItem = ({ channel, currentChannelId, onChannelClick, onRename, onRemove }) => {
  const isActive = currentChannelId === channel.id;

  return (
    <div
      role="listitem"
      className="d-flex align-items-center justify-content-between px-3 py-2 channel-item"
      style={{ cursor: 'pointer' }}
    >
      {/* Кнопка переключения на канал */}
      <button
        type="button"
        className={`flex-grow-1 text-start btn border-0 p-0 text-decoration-none ${
          isActive ? 'fw-bold' : 'text-muted'
        }`}
        onClick={() => onChannelClick(channel.id)}
        aria-current={isActive ? 'true' : 'false'}
        style={{ background: 'transparent', color: 'inherit' }}
      >
        # {channel.name}
      </button>

      {/* Dropdown с действиями — только для removable каналов */}
      {channel.removable && (
        <Dropdown align="end" autoClose="outside">
          <Dropdown.Toggle
            variant="link"
            bsPrefix="p-0"
            className="text-muted border-0 shadow-none btn btn-link dropdown-toggle-no-caret"
            id={`dropdown-channel-${channel.id}`}
            aria-label="Управление каналом"
            style={{ lineHeight: '1', padding: '0.5rem' }}
          >
            <span aria-hidden="true" className="fs-5">⋮</span>
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
