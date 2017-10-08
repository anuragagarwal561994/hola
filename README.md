## Branches
* Plivo Backend: [plivo](https://github.com/anuragagarwal561994/hola/tree/plivo)
* Android App: [android-app](https://github.com/anuragagarwal561994/hola/tree/android-app)
* Webapp: [webapp](https://github.com/anuragagarwal561994/hola/tree/webapp)

## Inspiration
It is common with me and people around me to get stuck in a situation where they need to call someone in emergency but somehow they can't because they don't remember their number and their phone is either lost or no battery. Once I had waited for half an hour for getting an uber, I got one finally but my phone ran off with battery and I couldn't go with him.

## What it does
One can configure in our webapp some of the emergency numbers that he/she might need to call in near time.
These are speed-dial numbers from 1-9. Then when in case of an emergency, the guy just needs to remember our simple number +1-888-666-8310, you will be first authenticated and from there you can call to any of your speed dial contacts. Also if you have installed and authenticated via our android app, you can call to the last number you talked to (incoming / outgoing). So now you just need another device (even landline will work). The best part is, the guy whose phone you are using won't be charged as the number is toll-free, while you will get monthly bills to pay.

## How we built it
We bought plivos number and are using plivos service to make this happen. We made use of its IVRS menu and call forwarding feature. Also we are using Firebase as our datastore for real-time actions as well as to authenticate our users. We planned to use PhonePe or any other payment gateways for our billing needs but we fell short of time. Our apps are deployed on free heroku servers. Plivo communicates with our backend API to decide what to do in case of a response from a user. We are also using Firebase to  authenticate our users on android and using BroadcastReceivers to monitor incoming and outgoing calls which are updated on Firebase.

## Challenges we ran into
Using firebase was a very tricky task. Most of the technical things we used, we were not very much familiar with it. Like in our team no one had ever used Android, firebase, angular (a bit of it we knew) and not plivo. So we were learning doing and made a lot of hacks just to make the things work in time. Another issue was to get a cheaper transactions from plivo, since it has not good support in India plus outbound and inbound calls has significant cost (which is negligible though in case of emergency). SMS Authentication also created a problem, we were looking for already made solutions but ran into a lot of troubles so we invested the same amount of time if we would have made it on our own.

## Accomplishments that we're proud of
Get to learn a lot of newer technologies. I tried calling my friends and parents from my application and they felt really proud of me. Now if this app can actually help someone in need, I will definately be proud of it.

## What we learned
Plivo
Firebase
Android
Angular
Workflow management

## What's next for hola
We thought of another extension to hola features and that is to make anynomous calls. It was a simple feature but we could not complete our things on expected time. So a user will generate a temporary masked number and an authentication token and can share it with anyone he want to call (example the girl he met on tinder). The other person can use the Hola number and use his given temporary authentication to connect with the first person (who will be charged). This can be a really funky feature. We didn't test (may be it currently has this feature) but with some modifications Hola can be available to make cheap international calls. If we get a lot of love and support we will try to invest in our SIPs and servers and not use expensive plivo services. This will in turn reduce cost of our customers too.
Also a customer might be given an option to prepaid or postpaid plans and also to receive calls in case if your phone is lost.
