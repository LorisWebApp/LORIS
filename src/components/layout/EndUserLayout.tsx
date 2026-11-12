import { Outlet, useMatch } from 'react-router-dom';
import { AssistantProvider } from '../assistant/AssistantProvider';
import { AssistantWidget } from '../assistant/AssistantWidget';
import { ROUTES } from '../../integration/loris';

/**
 * Layout route for every End User page. Mounted once, so anything rendered here
 * (the floating assistant and its conversation) persists across navigation.
 * Organisation Admin and Platform Manager routes must stay outside this layout.
 */
export function EndUserLayout() {
  // The full-page Assistant already is the assistant; a second one on top would be redundant.
  const onAssistantPage = useMatch(`${ROUTES.assistant}/*`) !== null;
  return (
    <AssistantProvider>
      <Outlet />
      {!onAssistantPage && <AssistantWidget />}
    </AssistantProvider>
  );
}
