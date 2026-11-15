import { Outlet } from 'react-router-dom';
import { AssistantProvider } from '../assistant/AssistantProvider';
import { AssistantWidget } from '../assistant/AssistantWidget';

/**
 * Layout route for every End User page. Mounted once, so anything rendered here
 * (the floating assistant and its conversation) persists across navigation.
 * Organisation Admin and Platform Manager routes must stay outside this layout.
 */
export function EndUserLayout() {
  return (
    <AssistantProvider>
      <Outlet />
      <AssistantWidget />
    </AssistantProvider>
  );
}
