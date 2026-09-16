import { renderListPage, renderApplyForm, renderLogin, getCurrentUser } from "./render";

export function renderPage(pageName: string) {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = '';

  if (!getCurrentUser()) {
    app.innerHTML = renderLogin();
    return;
  }

  switch (pageName) {
    case 'list':
      app.innerHTML = renderListPage();
      break;
    case 'apply':
      app.innerHTML = renderApplyForm();
      break;
    default:
      app.innerHTML = renderListPage();
  }
}
