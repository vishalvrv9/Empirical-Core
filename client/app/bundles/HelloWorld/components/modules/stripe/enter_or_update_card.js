import $ from 'jquery';

export default function (successCallback, payOrUpdate, schoolOrTeacher) {
  const urlString = payOrUpdate === 'Update' ? 'update_card' : `new_${schoolOrTeacher}_premium`;
  let panelLabel,
    description;
  if (payOrUpdate === 'update') {
    panelLabel = 'Update';
    description = 'Update Your Credit Card';
  } else {
    description = schoolOrTeacher === 'school' ? '$450 School Premium' : '$80 Teacher Premium';
    panelLabel = 'Purchase';
  }
  const handler = StripeCheckout.configure({
    key: stripePubKey,
    image: 'https://d1yxac6hjodhgc.cloudfront.net/wp-content/uploads/2015/11/Quill-Icon.svg',
    locale: 'auto',
    panelLabel,
    allowRememberMe: false,
    email: document.getElementById('current-user-email').getAttribute('content'),
    token(token) {
      $.post(`charges/${urlString}`,
          { authenticity_token: $('meta[name=csrf-token]').attr('content'), source: token, card: token.card, })
          .done((data) => {
            if (data.err) {
              // there is an error for this in the charges controller,
              // but better error is passing weirdness back
              const initialMessage = data.err.message ? data.err.message : 'Please ensure you are providing the same email used to login to Quill, and try again';
              alert(`Your card was not changed. ${initialMessage}. If the issue persists, please contact ryan@quill.org for help.`);
            } else if (data.message) {
              alert(data.message);
            }
            successCallback(token.card.last4);
          });
    },
  });

  handler.open({
    name: 'Quill Premium',
    description,
  });

    // Close Checkout on page navigation
  $(window).on('popstate', () => {
    handler.close();
  });
}
