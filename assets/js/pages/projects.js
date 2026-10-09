(function () {
  const ui = window.BNTUI;
  const root = document.getElementById('page-content');
  const host = document.getElementById('modal-root');
  if (!ui || !root || !host) return;

  const assignees = ['Караев Р.Р.', 'Ибраев С.С.', 'Смагулов Е.Т.', 'Ахметов Е.Е.', 'Байкенова М.М.', 'Байкенов А.А.', 'Ахметов У.М.'];
  root.innerHTML = ui.renderEmptyState('Создайте первый проект.', {
    title: 'Проектов пока нет',
    action: {label: 'Создать проект', attributes: {'data-project-create': true, 'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'aria-controls': 'project-drawer'}}
  });

  const drawer = ui.bindDrawer(host);
  const text = (name, label, placeholder, attributes = {}) => `<label class="form-input"><span class="form-input__label typography-label-smallest">${ui.escape(label)}</span><input class="form-input__control form-input__control--text typography-body-smallest" type="text" name="${name}" placeholder="${ui.escape(placeholder)}"${ui.attrs(attributes)}></label>`;
  root.addEventListener('click', event => {
    const trigger = event.target.closest('[data-project-create]');
    if (!trigger) return;
    let dispose = null;
    const fields = text('project-name', 'Название', 'Укажите название проекта', {required: true})
      + ui.renderFormInput({name: 'project-status', label: 'Статус', mode: 'single', value: 'Бэклог', options: ['Бэклог', 'В работе', 'Завершён']})
      + `<label class="form-input"><span class="form-input__label typography-label-smallest">Описание</span><span class="form-input__text-field"><svg class="form-input__text-icon" width="16" height="16" aria-hidden="true"><use href="/assets/icons/financial-interface.svg?v=16#Pencil"></use></svg><textarea class="form-input__control form-input__control--text typography-body-smallest" name="project-description" rows="5" placeholder="Описание проекта"></textarea></span></label>`
      + `<label class="form-input"><span class="form-input__label typography-label-smallest">Бюджет</span><span class="form-input__text-field form-input__text-field--inline-icon"><input class="form-input__control form-input__control--text typography-body-smallest" type="number" name="project-budget" min="0" step="any" placeholder="Бюджет проекта"><button class="form-input__number-stepper" type="button" data-form-input-number-stepper aria-label="Изменить бюджет проекта"><svg width="24" height="24" aria-hidden="true"><use href="/assets/icons/financial-interface.svg#SortDefault"></use></svg></button></span></label>`
      + ui.renderFormInput({name: 'project-assignees', label: 'Исполнители', emptyMessage: 'Выберите исполнителя', options: ['Всё', ...assignees]})
      + `<div class="equipment-date-grid">${ui.renderDateField({name: 'project-start', label: 'Дата начала'})}${ui.renderDateField({name: 'project-end', label: 'Дата завершения'})}</div>`;
    drawer.open({id: 'project-drawer', title: 'Новый проект', fields,
      footer: '<button class="button-smallest-primary-radius typography-button-smallest" type="submit"><span>Создать</span></button>' + ui.renderDrawerCancel(),
      formAttributes: {'data-project-form': true}
    }, trigger, () => dispose?.());
    dispose = ui.bindMultiFormInput(host.querySelector('[data-form-input="project-assignees"]'), {values: new Set(assignees.slice(0, 3))});
  });
  host.addEventListener('submit', event => {
    if (!event.target.matches('[data-project-form]')) return;
    event.preventDefault();
    drawer.close();
  });
}());
