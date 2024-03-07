import Toast from "react-native-root-toast";

// Internal queue to manage toast messages
let toastQueue = [];
let isToastVisible = false;

const showToast = (message, props) => {
  if (!Toast) {
    console.warn("Toast library not properly initialized.");
    return;
  }

  // Check if the message is already in the queue
  if (toastQueue.some((item) => item.message === message)) {
    return;
  }

  // Add the new message to the queue
  toastQueue.push({ message, props });

  // If no toast is currently visible, display the first message in the queue
  if (!isToastVisible) {
    displayNextToast();
  }
};

const displayNextToast = () => {
  if (toastQueue.length > 0) {
    const { message, props } = toastQueue[0];

    // Display the toast
    Toast.show(message, {
      ...props,
      onHidden: () => {
        // Remove the displayed message from the queue
        toastQueue.shift();

        // Set flag to indicate that no toast is currently visible
        isToastVisible = false;

        // Display the next message in the queue
        displayNextToast();
      },
    });

    // Set flag to indicate that a toast is currently visible
    isToastVisible = true;
  }
};

export { showToast };
