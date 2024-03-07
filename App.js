import { RootSiblingParent } from "react-native-root-siblings";
import { SafeAreaProvider } from "react-native-safe-area-context";

import MainNavigator from "./src/navigation/MainNavigator";

const App = () => {
  return (
    <RootSiblingParent>
      <SafeAreaProvider>
        <MainNavigator />
      </SafeAreaProvider>
    </RootSiblingParent>
  );
};

export default App;
