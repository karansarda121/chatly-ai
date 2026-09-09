import { useState } from 'react';

function GroupSettingsForm({ chat, isSaving, onCancel, onSave }) {
  const [name, setName] = useState(chat.name);
  const [description, setDescription] = useState(chat.description || '');

  async function handleSubmit(event) {
    event.preventDefault();
    await onSave({ name: name.trim(), description: description.trim() });
  }

  return (
    <form className="group-settings-form" onSubmit={handleSubmit}>
      <label htmlFor="group-name">Group name</label>
      <input
        id="group-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        minLength="3"
        maxLength="100"
        required
      />

      <label htmlFor="group-description">Description</label>
      <textarea
        id="group-description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        maxLength="300"
        placeholder="What is this group about?"
        rows="3"
      />

      <div className="group-settings-form__actions">
        <button type="button" onClick={onCancel}>Cancel</button>
        <button type="submit" disabled={isSaving || name.trim().length < 3}>
          {isSaving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

export default GroupSettingsForm;
