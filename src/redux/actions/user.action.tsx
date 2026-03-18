import * as TYPES from '@truckmitr/redux/actions/types'

export const userAuthenticatedAction = (payload: any) => ({
    type: TYPES['USER_AUTHENTICATED'], payload
})
export const userAction = (payload: any) => ({
    type: TYPES['FETCH_USER'], payload
})
export const subscriptionDetailsAction = (payload: any) => ({
    type: TYPES['SUBSCRIPTION_DETAILS'], payload
})
export const userEditAction = (payload: any) => ({
    type: TYPES['USER_PROFILE_EDIT'], payload
})
export const jobAddAction = (payload: any) => ({
    type: TYPES['ADD_JOB'], payload
})
export const driverProfileEditAction = (payload: any) => ({
    type: TYPES['DRIVER_PROFILE_EDIT'], payload
})
export const subscriptionModalAction = (payload: any) => ({
    type: TYPES['SUBSCRIPTION_MODAL'], payload
})
export const showTrainingModalAction = (payload: any) => ({
    type: TYPES['TRAINING_COMPLETE_MODAL'], payload
})
export const PaymentVerificationModalAction = (payload: any) => ({
    type: TYPES['PAYMENTVERIFICATION_MODAL'], payload
})
export const referEarnDataAction = (payload: any) => ({
    type: TYPES['REFER_EARN_DATA'], payload
})